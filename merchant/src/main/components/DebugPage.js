import React, { useState } from 'react'

export default function DebugPage() {
  const [ count, setCount ] = useState(0)

  return (
    <>
      <h2>DebugPage</h2>
      <div>{count}</div>
      <button onClick={() => setCount(count+1)}>+1</button>
    </>
  )
}
