import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import '../../styles/dashboard.css';

const SOCKET_SERVER_URL = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3001';

export default function LiveRoom() {
  const { id: roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('// Write your code here\nfunction sum(a, b) {\n  return a + b;\n}');
  const [socket, setSocket] = useState(null);
  const [peerConnected, setPeerConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    // Get Local Media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        newSocket.emit('join-room', roomId, user.id);
      })
      .catch(err => {
        console.error("Media access denied:", err);
        alert("Camera/Microphone access is required for live interviews.");
      });

    // Handle Remote Media
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setPeerConnected(true);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        newSocket.emit('ice-candidate', event.candidate);
      }
    };

    // Socket Events
    newSocket.on('user-connected', async (userId) => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      newSocket.emit('offer', offer);
    });

    newSocket.on('offer', async (offer) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit('answer', answer);
    });

    newSocket.on('answer', async (answer) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    newSocket.on('ice-candidate', async (candidate) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    });

    newSocket.on('code-update', (newCode) => {
      setCode(newCode);
    });

    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      pc.close();
      newSocket.disconnect();
    };
  }, [roomId, user]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket) {
      socket.emit('code-change', newCode);
    }
  };

  const handleLeave = () => {
    navigate(user?.role === 'candidate' ? '/candidate/interviews' : '/admin/interviews');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#1e1e1e', color: 'white' }}>
      
      {/* Left Pane - Code Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Live Interview: {roomId}</h2>
          <button className="btn btn--danger btn--sm" onClick={handleLeave}>End Session</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', fontFamily: '"Fira Code", monospace' }}>
          <Editor
            value={code}
            onValueChange={handleCodeChange}
            highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
              backgroundColor: '#1e1e1e',
              minHeight: '100%',
            }}
          />
        </div>
      </div>

      {/* Right Pane - Video Streams */}
      <div style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', backgroundColor: '#121212' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#aaa' }}>Remote</h3>
          <div style={{ width: '100%', height: '200px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
            {!peerConnected && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Waiting...</div>}
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#aaa' }}>You</h3>
          <div style={{ width: '100%', height: '200px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>

    </div>
  );
}
