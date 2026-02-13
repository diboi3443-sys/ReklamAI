import requests

def test_connect():
    url = "http://127.0.0.1:8288/e/local"
    print(f"Testing connection to {url} with requests...")
    try:
        resp = requests.post(url, json={"test": "data"})
        print(f"Response: {resp.status_code}")
        print(resp.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_connect()
