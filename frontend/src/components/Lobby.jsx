import {React, useCallback, useEffect, useState} from "react"
import { useNavigate } from "react-router-dom"
import { useSocketContext } from "../context/SocketProvider"
const Lobby = () => {
  const socket = useSocketContext()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    roomName: ""
  })

  const updateForm = (e) => {
    e.preventDefault()
    setFormData({...formData, [e.target.id]: e.target.value})
  }

  const handleSubmit = (e) =>{
    e.preventDefault()
    socket.emit("join", formData) 
  }

  const handleJoinRoom = useCallback((data) => {
    const { email, roomName } = data
    console.log(roomName);
    navigate(`/room/${roomName}`)
  }, [navigate])

  useEffect( () => {
    if(!socket){
      return;
    }
    socket.on('join', handleJoinRoom)
    return () => {
      socket.off('join', handleJoinRoom)
    }
  }, [socket])

  return (
    <>
  <div className="text-center mt-16">
    <h1 className="text-3xl mb-4">Lobby</h1>
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email:</label>
      <input type="email" id="email" value={formData.email} onChange={updateForm} />
      <br />
      <label htmlFor="roomName">Room:</label>
      <input type="text" id="roomName" value={formData.email} onChange={updateForm} />
      <br />
      <button type="submit" class="w-full px-4 py-2 bg-blue-500 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Call
      </button>

    </form>
  </div>
</>
  )
}
export default Lobby