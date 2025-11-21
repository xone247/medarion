#!/usr/bin/env python3
"""
Robust Port Forwarder: 38660 -> 3001
Handles errors gracefully and keeps running
"""
import socket
import threading
import sys
import time

def forward_data(src, dst, name):
    """Forward data between two sockets"""
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
    except (ConnectionResetError, BrokenPipeError, OSError, socket.error):
        # Normal connection close
        pass
    except Exception as e:
        print(f"Error in {name}: {e}", file=sys.stderr, flush=True)
    finally:
        try:
            src.shutdown(socket.SHUT_RDWR)
        except:
            pass
        try:
            src.close()
        except:
            pass

def handle_connection(client_sock, client_addr, dest_host, dest_port):
    """Handle a single client connection"""
    try:
        dest_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        dest_sock.settimeout(10)
        dest_sock.connect((dest_host, dest_port))
        
        # Start bidirectional forwarding
        t1 = threading.Thread(
            target=forward_data, 
            args=(client_sock, dest_sock, "client->dest"),
            daemon=True
        )
        t2 = threading.Thread(
            target=forward_data,
            args=(dest_sock, client_sock, "dest->client"),
            daemon=True
        )
        
        t1.start()
        t2.start()
        
        # Wait for threads to finish
        t1.join()
        t2.join()
        
    except socket.timeout:
        print(f"Timeout connecting to {dest_host}:{dest_port}", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"Error handling connection from {client_addr}: {e}", file=sys.stderr, flush=True)
    finally:
        try:
            client_sock.close()
        except:
            pass
        try:
            dest_sock.close()
        except:
            pass

def forward(source_port, dest_host, dest_port):
    """Main forwarding function"""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
    server.settimeout(1)  # Allow periodic checks
    
    try:
        server.bind(('0.0.0.0', source_port))
        server.listen(5)
        print(f"✅ Forwarding {source_port} -> {dest_host}:{dest_port}", flush=True)
        sys.stdout.flush()
    except OSError as e:
        print(f"❌ Failed to bind to port {source_port}: {e}", file=sys.stderr, flush=True)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr, flush=True)
        sys.exit(1)
    
    while True:
        try:
            client_sock, client_addr = server.accept()
            print(f"Connection from {client_addr}", flush=True)
            
            # Handle each connection in a separate thread
            thread = threading.Thread(
                target=handle_connection,
                args=(client_sock, client_addr, dest_host, dest_port),
                daemon=True
            )
            thread.start()
            
        except socket.timeout:
            # Normal timeout, continue listening
            continue
        except KeyboardInterrupt:
            print("\n🛑 Shutting down...", flush=True)
            break
        except Exception as e:
            print(f"Error accepting connection: {e}", file=sys.stderr, flush=True)
            time.sleep(0.1)  # Brief pause before retrying
            continue
    
    try:
        server.close()
    except:
        pass

if __name__ == '__main__':
    try:
        forward(38660, 'localhost', 3001)
    except KeyboardInterrupt:
        print("\n🛑 Stopped", flush=True)
        sys.exit(0)

