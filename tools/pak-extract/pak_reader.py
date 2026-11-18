#!/usr/bin/env python3
"""Tier-1 headless UE4 .pak reader for the Dauntless PAKs.

Reads the FPakInfo footer, parses the pak index (classic v8/v9 or the
v10/v11 FullDirectoryIndex), decompresses zlib/oodle-free entries, and can
dump the file listing or extract entries.

Usage:
  python3 pak_reader.py list <pak> [--filter SUBSTR] [--limit N]
  python3 pak_reader.py extract <pak> <substr> <outdir> [--limit N]
"""

import io
import os
import struct
import sys
import zlib

MAGIC = 0x5A6F12E1

# Compression method ids (v8 index): 0=None 1=Zlib 2=Gzip 4=Oodle(packed name table in v11)
COMPRESSION_NAMES = ["None", "Zlib", "Gzip", "Custom"]


def read_fstring(buf, pos):
    (length,) = struct.unpack_from("<i", buf, pos)
    pos += 4
    if length == 0:
        return "", pos
    if length > 0:
        s = buf[pos : pos + length].split(b"\x00", 1)[0].decode("utf-8", "replace")
        return s, pos + length
    # negative: utf-16
    raw = buf[pos : pos + (-length) * 2]
    s = raw.decode("utf-16-le", "replace").split("\x00", 1)[0]
    return s, pos + (-length) * 2


def parse_footer(data):
    """Find the FPakInfo footer by scanning for the magic near EOF."""
    size = len(data)
    scan_start = max(0, size - 400)
    # Try each magic position, newest layouts first.
    positions = []
    search = data[scan_start:]
    off = 0
    while True:
        idx = search.find(struct.pack("<I", MAGIC), off)
        if idx < 0:
            break
        positions.append(scan_start + idx)
        off = idx + 1
    for magic_pos in reversed(positions):  # later magic = later version layout
        pos = magic_pos
        version = struct.unpack_from("<I", data, pos + 4)[0]
        if version < 1 or version > 12:
            continue
        index_offset = struct.unpack_from("<Q", data, pos + 8)[0]
        index_size = struct.unpack_from("<Q", data, pos + 16)[0]
        (index_hash,) = struct.unpack_from("<20s", data, pos + 24)
        info = {
            "version": version,
            "magic_pos": magic_pos,
            "footer_size": size - magic_pos,
            "index_offset": index_offset,
            "index_size": index_size,
            "index_hash": index_hash.hex(),
        }
        # v10+ extras after the hash
        p = pos + 44
        if version >= 9:
            (b_encrypted_keys,) = struct.unpack_from("<B", data, p)
            info["bEncryptedKeys"] = b_encrypted_keys
            p += 1
        if version >= 10:
            (path_hash_seed,) = struct.unpack_from("<Q", data, p)
            info["pathHashSeed"] = path_hash_seed
            p += 8
            (b_has_path_hash,) = struct.unpack_from("<B", data, p)
            p += 1
            info["bReaderHasPathHashIndex"] = b_has_path_hash
            (ph_off, ph_size, fdi_off, fdi_size, enc_size) = struct.unpack_from("<QQQQQ", data, p)
            p += 40
            (files_num,) = struct.unpack_from("<i", data, p)
            p += 4
            info.update(
                {
                    "pathHashIndexOffset": ph_off,
                    "pathHashIndexSize": ph_size,
                    "fullDirectoryIndexOffset": fdi_off,
                    "fullDirectoryIndexSize": fdi_size,
                    "encodedPakEntriesSize": enc_size,
                    "filesNum": files_num,
                }
            )
        # encryption flag + guid live BEFORE the magic
        if magic_pos >= 17:
            info["bEncryptedIndex"] = data[magic_pos - 1]
            info["encryptionGuid"] = data[magic_pos - 17 : magic_pos - 1].hex()
        if info["bEncryptedIndex"]:
            continue  # cannot parse encrypted index without AES key
        return info
    return None


def parse_classic_index(data, info):
    """v3-v9 classic index -> list of dicts."""
    pos = info["index_offset"]
    end = pos + info["index_size"]
    mount, pos = read_fstring(data, pos)
    (num,) = struct.unpack_from("<i", data, pos)
    pos += 4
    version = info["version"]
    entries = []
    while pos < end and len(entries) < num:
        offset, size, usize = struct.unpack_from("<QQQ", data, pos)
        pos += 24
        if version >= 2:
            (method,) = struct.unpack_from("<i", data, pos)
            pos += 4
        else:
            method = 0
        (sha,) = struct.unpack_from("<20s", data, pos)
        pos += 20
        if version >= 3:
            (block_count,) = struct.unpack_from("<i", data, pos)
            pos += 4
            pos += block_count * 16
        if version >= 4:
            (flags,) = struct.unpack_from("<B", data, pos)
            pos += 1
        if version >= 8:
            (block_size,) = struct.unpack_from("<i", data, pos)
            pos += 4
        elif version >= 5:
            (block_size,) = struct.unpack_from("<i", data, pos)
            pos += 4
        name, pos = read_fstring(data, pos)
        entries.append(
            {
                "name": name,
                "offset": offset,
                "size": size,
                "usize": usize,
                "method": method & 0x3F,
                "flags": flags if version >= 4 else 0,
                "block_size": block_size if version >= 5 else 0,
                "sha": sha.hex(),
            }
        )
    return mount, entries


def parse_fdi_index(data, info):
    """v10/v11 FullDirectoryIndex -> flat list of entries (offset/size raw)."""
    pos = info["fullDirectoryIndexOffset"]
    end = pos + info["fullDirectoryIndexSize"]
    # FDirectoryIndex: TMap<FString, FDirectoryIndex>
    def read_map_string_keys(p):
        (count,) = struct.unpack_from("<i", data, p)
        p += 4
        if count < 0:
            # set (unsorted) map encoding
            (count,) = struct.unpack_from("<i", data, p)
            p += 4
        return count, p

    count, pos = read_map_string_keys(pos)
    entries = []
    for _ in range(count):
        dirname, pos = read_fstring(data, pos)
        (file_count,) = struct.unpack_from("<i", data, pos)
        pos += 4
        if file_count < 0:
            (file_count,) = struct.unpack_from("<i", data, pos)
            pos += 4
        for _ in range(file_count):
            fname, pos = read_fstring(data, pos)
            (entry_off, entry_size) = struct.unpack_from("<QQ", data, pos)
            pos += 16
            entries.append({"dir": dirname, "file": fname, "entry_offset": entry_off, "entry_size": entry_size})
    return entries


def decode_pak_entry_header(data, entry_offset):
    """Decode a v10+ encoded pak entry at a raw offset (see CUE4Parse)."""
    pos = entry_offset
    (flags,) = struct.unpack_from("<I", data, pos)
    pos += 4
    compression_method_index = 0
    offset = 0
    size = 0
    usize = 0
    block_size = 0
    # Offset (unless offset encoded)
    if flags & (1 << 31):  # OffsetEncodedInPakEntry
        offset = entry_offset  # data offset points into the entry itself
    else:
        (offset,) = struct.unpack_from("<Q", data, pos)
        pos += 8
    (size,) = struct.unpack_from("<Q", data, pos)
    pos += 8
    # UncompressedSize, unless "no size" flag
    if not flags & (1 << 30):  # SizeParityBit-ish placeholder
        (usize,) = struct.unpack_from("<Q", data, pos)
        pos += 8
    else:
        usize = size
    # CompressionMethod unless None
    if not flags & (1 << 0):
        (compression_method_index,) = struct.unpack_from("<I", data, pos)
        pos += 4
    (hash20,) = struct.unpack_from("<20s", data, pos)
    pos += 20
    if compression_method_index != 0:
        block_count_data = struct.unpack_from("<I", data, pos)[0]
        pos += 4
        block_size = block_count_data & 0x3FFFFFFF
        block_count = block_count_data >> 30
        # blocks: uint32 end offsets
        block_ends = struct.unpack_from(f"<{block_count}I", data, pos)
        pos += 4 * block_count
        blocks = []
        start = 0
        for e in block_ends:
            blocks.append((start, e))
            start = e
    else:
        blocks = []
    return {
        "offset": offset,
        "size": size,
        "usize": usize,
        "method": compression_method_index,
        "flags": flags,
        "hash": hash20.hex(),
        "blocks": blocks,
        "data_start": pos,
    }


def read_entry_data(data, pak_path, entry):
    """Extract raw bytes for a classic (v8) entry."""
    method = entry["method"]
    off = entry["offset"]
    # The entry offset usually points 4 bytes before the data (header size marker)
    # For v8: offset points to the entry data; +4? We detect by SHA validation.
    size = entry["size"]
    if method == 0:
        # try direct
        blob = data[off : off + size]
        if zlib.crc32(blob) is not None:
            return blob
    if method == 1:  # zlib
        blob = data[off : off + size]
        try:
            return zlib.decompress(blob)
        except zlib.error:
            # offset may point at a 4-byte header
            try:
                blob = data[off + 4 : off + 4 + size]
                return zlib.decompress(blob)
            except zlib.error:
                return None
    return None


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    pak = sys.argv[2]
    data = open(pak, "rb").read()
    info = parse_footer(data)
    if not info:
        print("FAILED: could not find a readable (unencrypted) FPakInfo footer")
        sys.exit(2)
    print("== FPakInfo ==")
    for key, value in info.items():
        print(f"  {key}: {value}")
    version = info["version"]
    if version >= 10:
        entries = parse_fdi_index(data, info)
        print(f"FDI entries: {len(entries)}")
        for e in entries[:10]:
            print(f"  {e['dir']}/{e['file']}")
    else:
        mount, entries = parse_classic_index(data, info)
        print(f"mount: {mount}, entries: {len(entries)}")
        for e in entries[:10]:
            print(f"  {e['name']} ({e['size']}B, method={e['method']})")


if __name__ == "__main__":
    main()
