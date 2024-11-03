d = {}
word = 'bin'
for c in word:
    if c not in d:
        d[c] = {}
    d = d[c]
    print(d)