import { Routes, Route } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Lobby from "./components/Lobby";
import Room from "./components/Room";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomID" element={<Room/>}/>
      </Routes>
    </div>
  );
}

export default App;
