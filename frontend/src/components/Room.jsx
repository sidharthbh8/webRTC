import { useCallback, useEffect, useState } from "react"
import { useSocketContext } from "../context/SocketProvider"
import Peer2PeerService from "../service/p2p"
import ReactPlayer from "react-player"

const Room = () => {
    const socket = useSocketContext()
    const [remoteSocketId, setRemoteSocketID] = useState(null)
    const [myStream, setMyStream] = useState()
    const [remoteStream, setRemoteStream] = useState()

    const userJoined = useCallback((data) => {
        console.log(data);
        setRemoteSocketID(data.socketId)
    }, [])

    const handleIncomingCall = useCallback(async ({from, offer}) =>{
        setRemoteSocketID(from)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        setMyStream(stream);
        const answer = await Peer2PeerService.getAnswer(offer)
        socket.emit('call:accepted', { to: from, answer })
    }, [socket])

    const sendStreams = useCallback(() => {
        console.log(myStream);
        for (const track of myStream.getTracks()) {
            Peer2PeerService.peer.addTrack(track, myStream);
        }
      }, [myStream]);
    
    const handleCallAccepted = useCallback(
      ({ from, answer }) => {
        Peer2PeerService.setLocalDescription(answer);
        console.log("Call Accepted!");
        if (myStream) {
            sendStreams();
        }
      },
      [sendStreams]
    );

    const handleNegotiationFinal = useCallback(async ({ from, answer }) => {
        await Peer2PeerService.setRemoteDescription(answer);
    }, [])

    const handleNegotiationIncoming = useCallback(async ({ from, offer }) => {
        const answer = await Peer2PeerService.getAnswer(offer);
        socket.emit('nego:final', { to: from, answer });
    }, [socket]);

    const handleNegotiationNeeded = useCallback(async () => {
        const offer = await Peer2PeerService.getOffer();
        socket.emit('nego:needed', { to: remoteSocketId, offer });
    }, [remoteSocketId, socket])
    
    useEffect(() => {
        Peer2PeerService.peer.addEventListener('negotiationneeded', handleNegotiationNeeded)

        return () => {
            Peer2PeerService.peer.removeEventListener('negotiationneeded', handleNegotiationNeeded)
        }
    }, [handleNegotiationNeeded])

    const handleCall = useCallback( async() => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            const offer = await Peer2PeerService.getOffer();
            socket.emit('user:call', { to: remoteSocketId, offer });
            setMyStream(stream);
        } catch (error) {
            console.error("Error during call initiation:", error);
        }
    }, [remoteSocketId, socket])

    useEffect(() => {
        Peer2PeerService.peer.addEventListener('track', (ev) => {
            const remoteStr = ev.streams;
            setRemoteStream(remoteStr[0]);
            console.log(remoteStream);
        })
        
    }, []);

    useEffect(() => {
        if(!socket){
            return;
        }
        socket.on('UserJoined', userJoined)
        socket.on('incoming:call', handleIncomingCall)
        socket.on('call:accepted', handleCallAccepted)
        socket.on('nego:needed', handleNegotiationIncoming)
        socket.on('nego:final', handleNegotiationFinal)

        return () => {
            socket.off('UserJoined', userJoined)
            socket.off('incoming:call', handleIncomingCall)
            socket.off('call:accepted', handleCallAccepted)
            socket.off('nego:needed', handleNegotiationIncoming) 
            socket.off('nego:final', handleNegotiationFinal)
        }
    }, [socket, userJoined, handleIncomingCall, handleCallAccepted, handleNegotiationIncoming, handleNegotiationFinal])


  return (
    <div>
        <h1>Room</h1>
        <h4>{remoteSocketId? 'Connected' : 'No one else here'}</h4>
        { myStream && <button onClick={sendStreams}>Send Stream</button>}
        { remoteSocketId && <button onClick={handleCall}>Call</button> }
        { myStream && (<><h1>Your Video</h1> <ReactPlayer playing muted height="200px" width="400px" url={myStream} /></>)}
        { remoteStream && (<><h1>Remote Video</h1> <ReactPlayer playing muted height="200px" width="400px" url={remoteStream} /></>)}

    </div>
  )
}
export default Room
