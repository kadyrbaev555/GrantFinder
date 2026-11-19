import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './style.css'

function ConnectionStatus() {
  const [status, setStatus] = useState('pending')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function check() {
      try {
        const response = await fetch('/health', {
          signal: controller.signal,
          cache: 'no-store',
        })
        const healthy = response.ok && (await response.json()).status === 'ok'
        setStatus(healthy ? 'ok' : 'error')
      } catch {
        if (!controller.signal.aborted) setStatus('error')
      }
    }
    check()
    return () => controller.abort()
  }, [attempt])

  const labels = {
    pending: 'Проверяем соединение…',
    ok: 'Соединение с API установлено',
    error: 'Не удалось подключиться к API',
  }

  return (
    <footer>
      <span role="status" data-state={status}>{labels[status]}</span>
      {status === 'error' && (
        <button onClick={() => {
          setStatus('pending')
          setAttempt(attempt + 1)
        }}>Проверить снова</button>
      )}
    </footer>
  )
}

function App() {
  return (
    <>
      <header><span aria-hidden="true" className="mark">↗</span> GrantFinder</header>
      <main>
        <h1>Гранты и<br /><em>стипендии</em></h1>
        <p>Бесплатная платформа для студентов Казахстана. Образовательные возможности для бакалавриата и магистратуры в одном месте.</p>
      </main>
      <ConnectionStatus />
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
