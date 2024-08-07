import { Todo } from '../frontend/Todo'

export default function App() {
  //check if the url has a path with /frame with it
  const isInFrame = window.location.pathname.includes('/frame')
  //get the second part of the path as the title
  const title = window.location.pathname.split('/')[2]
  if (isInFrame)
    return (
      <div>
        <center>
          {title}:{' '}
          <button onClick={() => window.location.reload()}>reload page</button>
        </center>
        <hr />
        <Todo />
      </div>
    )
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <iframe
        src="/frame/user-a"
        style={{ borderStyle: 'solid', padding: 4, width: 340, height: 600 }}
      ></iframe>

      <iframe
        src="/frame/user-b"
        style={{ borderStyle: 'solid', padding: 4, width: 340 }}
      ></iframe>
    </div>
  )
}
