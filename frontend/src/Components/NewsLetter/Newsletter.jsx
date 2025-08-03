import React from 'react'
import './Newsletter.css'

const Newsletter = () => {
  return (
    <div className='newsletter'>
      <h1>Get Exclucive offers On Your Email</h1>
      <p>Subscribe to our newsletter and stay updated</p>
      <div>
        <input type="email" placeholder='Your E-mail id' />
        <button>Subscribe</button>
      </div>
    </div>
  )
}

export default Newsletter
