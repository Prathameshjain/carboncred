import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Registration from "./components/Registration";
import Dashboard from "./components/Dashboard";
import Marketplace from "./components/Marketplace";
import Mycredits from "./components/Mycredits";
import PurchaseHistory from "./components/PurchaseHistory";
import AddProject from "./components/AddProject";
import "./App.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/Login" element={<Login/>}/>
        <Route path="/Registration" element={<Registration/>}/>
        <Route path="/Dashboard" element={<Dashboard/>}/>
        <Route path="/Marketplace" element={<Marketplace/>}/>
        <Route path="/Mycredits" element={<Mycredits/>}/>
        <Route path="/PurchaseHistory" element={<PurchaseHistory/>}/>
        <Route path="/AddProject" element={<AddProject/>}/> 
      </Routes>
    </>
  );
}

export default App;
