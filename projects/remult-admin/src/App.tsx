import { useEffect, useMemo, useState } from 'react'

import { Table } from './components/table'
import { DisplayOptions, EntityUIInfo } from '../../core/server/remult-admin'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  NavLink,
} from 'react-router-dom'
import { God } from './God'
import { Erd } from './components/erd/erd'

declare const entities: EntityUIInfo[]
declare let optionsFromServer: DisplayOptions

function App() {
  const [god, setGod] = useState<God>()
  const [options, setOptions] = useState<DisplayOptions>({})

  useEffect(() => {
    if (import.meta.env.DEV) {
      fetch('/api/dev-admin')
        .then((x) => x.json())
        .then((x) => setGod(new God(x)))
    } else {
      setGod(new God(entities))
      setOptions(optionsFromServer)
    }
  }, [])

  // if window less than 1024px, add hide-navigation to body
  useEffect(() => {
    if (window.innerWidth < 1024) {
      document.body.classList.add('hide-navigation')
    }
  }, [])

  if (!god) return <div>Loading...</div>

  return (
    <>
      <BrowserRouter basename={options?.baseUrl}>
        <div className="app-holder">

          <div className="main-navigation">
            <div className="main-navigation__title">
              Remult Admin
            </div>

            <NavLink className="tab" to="erd">
              ERD
            </NavLink>
            {god?.tables.map((t) => (
              <NavLink className="tab" key={t.key} to={t.key}>
                {t.caption}
              </NavLink>
            ))}
          </div>

          <div className="main-content">
            <Routes>
              <Route path="erd" element={<Erd god={god} />} />
              {god?.tables.map((table) => (
                <Route
                  key={table.key}
                  path={table.key}
                  element={
                    <Table
                      god={god}
                      columns={table.fields}
                      repo={table.repo}
                      relations={table.relations}
                    />
                  }
                />
              ))}

              <Route
                path="/"
                element={
                  <Navigate
                    to={
                      god?.tables && god?.tables.length > 0
                        ? god?.tables[0].key
                        : '/'
                    }
                  />
                }
              />
            </Routes>
          </div>

        </div>
      </BrowserRouter>
    </>
  )
}

export default App

//[V] - doesn't update well
//[V] - live refresh doesn't work
//[V] - update id doesn't work

//[ ] - support compound id (order details)
//[ ] - relation from product to supplier one to many, did not present in the erd
//[ ] - focus indication for buttons
//[ ] - support where on relations (select from table of tables etc....)
//[ ] - store erd positions
//[ ] - support more complex relations
//[ ] - support compound id for admin and erd
//[ ] - support id column
//[ ] - add loading indication

//[ ] - serialize find options to uri
//[ ] - support checkbox :)
//[ ] - respect allow update for column
//[ ] - respect api update / delete /insert ruiles
//[ ] - add json editor
