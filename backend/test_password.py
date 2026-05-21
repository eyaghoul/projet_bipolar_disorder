import bcrypt

# The hash from doctor3@gmail.com account
stored_hash = "$2b$12$P92HSGen4PUQXjlO2s1Pfe.Yzz8NFRySlbHOVGdZchvN7widAb1Ae"

# Test different passwords
test_passwords = ["doctor3", "Doctor3", "password", "12345678", "doctor123"]

print("Testing passwords for doctor3@gmail.com:")
for pwd in test_passwords:
    pwd_bytes = pwd.encode('utf-8')
    hash_bytes = stored_hash.encode('utf-8')
    matches = bcrypt.checkpw(pwd_bytes, hash_bytes)
    print(f"  '{pwd}': {'✓ MATCH' if matches else '✗ no match'}")
