import React, { useState } from 'react'
import './CSS/LoginSignup.css'

const LoginSignup = () => {

  const [state, setState] = useState("Login");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: ""
  });

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    console.log(formData);
  }

  const login = async () => {
    console.log("Login function called", formData);
    let responseData;
    await fetch(`${process.env.REACT_APP_API_URL}/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData),
    }).then((response) => response.json()).then((data) => responseData = data)

    if (responseData.success) {
      localStorage.setItem('auth-token', responseData.token);
      window.location.replace("/");
    } else {
      alert(responseData.error);
    }
  }

  const signup = async () => {
    console.log("Signup function called", formData);
    let responseData;
    await fetch(`${process.env.REACT_APP_API_URL}/signup`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData),
    }).then((response) => response.json()).then((data) => responseData = data)

    if (responseData.success) {
      localStorage.setItem('auth-token', responseData.token);
      window.location.replace("/");
    } else {
      alert(responseData.error);
    }
  }

  return (
    <div className='loginsignup'>
      <div className="loginsignup-container">
        <h1>{state}</h1>
        <div className='loginsignup-fields'>
          {state === "Sign Up" ? <input type="text" name='username' value={formData.username} onChange={changeHandler} placeholder='Your Name' /> : <></>}
          <input name='email' value={formData.email} onChange={changeHandler} type="email" placeholder="E-mail Address" />
          <input name='password' value={formData.password} onChange={changeHandler} type="password" placeholder='Password' />
          <button onClick={() => { state === "Login" ? login() : signup() }}>Continue</button>
          {state === "Sign Up"
            ? <p className="loginsignup-login">Already have an account? <span onClick={() => { setState("Login") }}>Login here</span></p>
            : <p className="loginsignup-login">Create an account? <span onClick={() => { setState("Sign Up") }}>Click here</span></p>}
        </div>
        <div className="loginsignup-agree">
          <input type="checkbox" name='' id='' />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>
      </div>
    </div>
  )
}

export default LoginSignup;
