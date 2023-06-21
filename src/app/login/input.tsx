'use client'

import React, { useState } from "react";

export function InputPassword(props: {
  placeholder?: string
  autoComplete?: string
  onChange: (event: React.ChangeEvent) => any
  onKeyUp: (event: React.KeyboardEvent) => any
}) {
  const [show, setShow] = useState<boolean>(false);

  return (
    <p>
      <input
        type={show ? "text" : "password"}
        {...props}
      />
      <button onClick={e => {e.preventDefault(); setShow(!show)}} style={{width: "fit-content"}}>view</button>
    </p>
  )
}
