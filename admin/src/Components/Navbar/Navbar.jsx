import React from 'react'
import './Navbar.css'
import logo from '../../assets/logo.png'
import navProfile from '../../assets/nav-profile.svg'

const Navbar = () => {
  return (
    <div className='navbar'>
      <div className='navbar-logo'><img src={logo} alt="" />
        <div className='logo-name'><p>MODERA</p> 
        <p className='logo-admin'>Admin Panel</p></div></div>
      
      <img src={navProfile} className='nav-profile' alt="" />
    </div>
  )
}

export default Navbar
