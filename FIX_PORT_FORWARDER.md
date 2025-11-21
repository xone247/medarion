# 🔧 Fix Port Forwarder - More Robust Version

## Check the error first:
```bash
cat forward.log
```

## Fixed Version (More Robust):

```bash
cat > /workspace/port_forward.py << 'EOF'
#!/usr/bin/env python3
import socket
import threading
import sys

def forward_data(src, dst, direction):
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.send(data)
    except (ConnectionResetError, BrokenPipeError, OSError):
        pass
    except Exception as e:
        print(f"Error in {direction}: {e}", file=sys.stderr)
    finally:
        try:
            src.close()
        except:
            pass
        try:
            dst.close()
        except:
            pass

def forward(source_port, dest_host, dest_port):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
    
    try:
        server.bind(('0.0.0.0', source_port))
        server.listen(5)
        print(f"✅ Forwarding {source_port} -> {dest_host}:{dest_port}", flush=True)
    except Exception as e:
        print(f"❌ Failed to bind: {e}", file=sys.stderr)
        sys.exit(1)
    
    while True:
        try:
            client, addr = server.accept()
            print(f"Connection from {addr}", flush=True)
            
            dest = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            dest.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
            dest.connect((dest_host, dest_port))
            
            t1 = threading.Thread(target=forward_data, args=(client, dest, "client->dest"), daemon=True)
            t2 = threading.Thread(target=forward_data, args=(dest, client, "dest->client"), daemon=True)
            
            t1.start()
            t2.start()
        except Exception as e:
            print(f"Error accepting connection: {e}", file=sys.stderr)
            continue

if __name__ == '__main__':
    forward(38660, 'localhost', 3001)
EOF

chmod +x /workspace/port_forward.py
```

## Alternative: Use iptables (if available)

```bash
# Check if iptables is available
which iptables

# If yes, use port forwarding
iptables -t nat -A PREROUTING -p tcp --dport 38660 -j REDIRECT --to-port 3001
iptables -t nat -A OUTPUT -p tcp --dport 38660 -j REDIRECT --to-port 3001
```

## Alternative: Use ncat (if available)

```bash
# Install ncat
apt-get install -y nmap

# Forward with ncat
nohup ncat -l 38660 -c "ncat localhost 3001" > /dev/null 2>&1 &
```

## Alternative: Simple netcat

```bash
# Install netcat
apt-get install -y netcat

# Forward (one-way, but might work)
mkfifo /tmp/fifo
nohup bash -c 'while true; do nc -l 38660 < /tmp/fifo | nc localhost 3001 > /tmp/fifo; done' > /dev/null 2>&1 &
```

