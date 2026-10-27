rule EICAR_Test_File { strings: $a = "EICAR-STANDARD-ANTIVIRUS-TEST-FILE" condition: $a }
rule NativeExecutable { condition: uint16(0) == 0x5A4D or uint32(0) == 0x464c457f }
