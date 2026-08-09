import urllib.request
from urllib.error import HTTPError
try:
    req = urllib.request.Request('http://114.132.183.186:3000/api/questions?testId=destiny-lover')
    urllib.request.urlopen(req)
except HTTPError as e:
    print(e.headers)
    print(e.read().decode('utf-8'))
