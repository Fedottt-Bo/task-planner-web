'use client'

import Cookies from 'js-cookie';
import { useState } from "react";
import { useRouter } from 'next/navigation';

import '../../form_style.css'

export default function SheetCreate() {
  const Router = useRouter();

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<JSX.Element>(<></>);

  function validateName() {
    if (/[^0-9a-zA-Z_#&@-]/.test(name)) {
      setNameError(<p>sheet name can have only 0-9 a-z A-z _-#&@</p>);
      return false;
    }

    if (!/.{3,}/.test(name)) {
      setNameError(<p>sheet name must contain 3 symbols</p>);
      return false;
    }

    setNameError(<></>);
    return true;
  }

  function submit() {
    if (validateName()) {
      console.log(`Triing create sheet: ${{name}}`);

      fetch('/api/sheets/create', {method: 'POST', body: JSON.stringify({username: Cookies.get('username'), name})})
        .then(res => {
          if (res.ok) {
            Router.replace(`/sheets/${name}`);
          }
        })
    }
  }

  return(
    <div>
      <form>
        <label className="formStdInput">
          <p>Sheet name</p>
          <input type="text" autoComplete="sheet-name" placeholder="sheet name" minLength={3} onKeyUp={e => validateName()} onChange={e => setName(e.target.value)}/>
          <span className="formStdInputError">
            {nameError}
          </span>
        </label>
        <div className="formStdButton">
          <button type="button" onClick={submit}>Submit</button>
        </div>
      </form>
    </div>
  )
}