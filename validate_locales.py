import json

locales = ['de','en','fr','es','it','pt','nl','pl','cs','hu','ro']
de_keys = set()

def get_keys(obj, prefix=''):
    keys = set()
    for k, v in obj.items():
        full = prefix + '.' + k if prefix else k
        if isinstance(v, dict):
            keys.update(get_keys(v, full))
        else:
            keys.add(full)
    return keys

for loc in locales:
    path = 'src/locales/' + loc + '/common.json'
    try:
        with open(path) as f:
            data = json.load(f)
        keys = get_keys(data)
        if loc == 'de':
            de_keys = keys
        missing = de_keys - keys
        extra = keys - de_keys
        if not missing and not extra:
            print(loc + ': ' + str(len(keys)) + ' keys - OK')
        else:
            print(loc + ': ' + str(len(keys)) + ' keys - MISSING ' + str(len(missing)) + ', EXTRA ' + str(len(extra)))
            if missing:
                for m in sorted(missing)[:5]:
                    print('  miss: ' + m)
            if extra:
                for e in sorted(extra)[:5]:
                    print('  extra: ' + e)
    except Exception as e:
        print(loc + ': ERROR - ' + str(e))
