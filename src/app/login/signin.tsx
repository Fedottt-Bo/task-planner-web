'use client'

import Cookies from 'js-cookie';
import React, { useState } from "react";
import { useRouter } from 'next/navigation';

import { InputPassword } from './input'

import '../form_style.css'

export default function Signin() {
  const Router = useRouter();

  const [username, setUserName] = useState("");
  const [usernameError, setUsernameError] = useState<JSX.Element>(<></>);

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<JSX.Element>(<></>);

  function validateUserName() {
    if (/[^0-9a-zA-Z]/.test(username)) {
      setUsernameError(<p>user name can have only 0-9 a-z A-z</p>);
      return false;
    }

    if (!/.{3,}/.test(username)) {
      setUsernameError(<p>user name must contain 3 symbols</p>);
      return false;
    }

    setUsernameError(<></>);
    return true;
  }

  function validatePassword() {
    if (/[^0-9a-zA-Z+*/@#%&-]/.test(password)) {
      setPasswordError(<p>password can have only 0-9 a-z A-z and +-*/@#%&</p>);
      return false;
    }
    
    if (!/.{3,}/.test(password)) {
      setPasswordError(<p>password must contain 3 symbols</p>);
      return false;
    }
    
    setPasswordError(<></>);
    return true;
  }

  function submit() {
    if (validateUserName() && validatePassword()) {
      console.log(`Triing signin: ${{username, password}}`);
      fetch('/api/account/signin', {method: 'POST', body: JSON.stringify({username, password})})
        .then(res => {
          if (res.ok) {
            Cookies.set("username", username, {expires: 7});
            Cookies.set("key", password, {expires: 7});

            Router.replace("/");
          }
        })
    }
  }

  return(
    <div>
      <form>
        <div className="formStdInput">
          <label>Username</label>
          <p>
            <input type="text" autoComplete="username" placeholder="your username" onKeyUp={e => validateUserName()} onChange={e => setUserName(e.target.value)}/>
          </p>
          <span className="formStdInputError">
            {usernameError}
          </span>
        </div>
        <div className="formStdInput">
          <label>Password</label>
          <InputPassword autoComplete="current-password" placeholder="password" onKeyUp={e => validatePassword()} onChange={e => setPassword((e.target as HTMLTextAreaElement).value)}/>
          <span className="formStdInputError">
            {passwordError}
          </span>
        </div>
        <div className="formStdButton">
          <button type="button" onClick={e => {e.preventDefault(); submit()}}>Submit</button>
        </div>
      </form>
    </div>
  )
}