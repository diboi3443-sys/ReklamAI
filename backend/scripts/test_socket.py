import socket
import os

def test_socket():
    host = "::1"
    port = 8288
    print(f"Testing socket connection to {host}:{port}...")
    try:
        s = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        s.settimeout(2)
        result = s.connect_ex((host, port))
        if result == 0:
            print("Socket open")
        else:
            print(f"Socket closed/filtered: {result}")
        s.close()
    except Exception as e:
        print(f"Socket error: {e}")

    print("\nEnvironment Variables:")
    for k, v in os.environ.items():
        if "PROXY" in k.upper():
            print(f"{k}: {v}")

if __name__ == "__main__":
    test_socket()
