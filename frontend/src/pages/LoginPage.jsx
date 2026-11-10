import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await signIn({ identificador: identifier, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="login-page login-enterprise">
      <section className="login-showcase" aria-label="Información de ObraStock">
        <div className="login-brand">
          <div className="login-brand-icon"><LockKeyhole size={20} /></div>
          <div>
            <div className="login-brand-title">OBRA<span>STOCK</span> <small>ENTERPRISE</small></div>
            <p>Control de Inventario &amp; Logística de Obra</p>
          </div>
        </div>

        <div className="login-showcase-copy">
          <span className="login-live-label"><i /> Trazabilidad total en tiempo real</span>
          <h1>Gestión inteligente de bodegas, faenas y abastecimiento integral.</h1>
          <p>Centralice el control de activos, materiales de construcción, despachos y maquinaria pesada con auditoría continua y fiabilidad operativa garantizada.</p>
        </div>

        <div className="login-trust-grid" aria-label="Indicadores del sistema">
          <article><strong>99.98%</strong><span>Disponibilidad SLA</span></article>
          <article><strong>&lt; 0.2s</strong><span>Auditoría en vivo</span></article>
          <article><strong>AES-256</strong><span>Cifrado bancario</span></article>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-support">◉ Soporte TI</div>
        <div className="login-form-wrap">
          <div className="login-security-icon"><LockKeyhole size={19} /></div>
          <h2>Iniciar sesión</h2>
          <p className="login-intro">Accede al control de inventario, faenas y logística de tu empresa.</p>

          <form onSubmit={submit}>
            <label className="form-field login-field">
              <span>Correo o identificación</span>
              <div className="login-input-wrap">
                <UserRound size={15} aria-hidden="true" />
                <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" placeholder="ejemplo@obrastock.com o ID faena" required />
              </div>
            </label>
            <label className="form-field login-field">
              <span>Contraseña</span>
              <div className="login-input-wrap password-field">
                <LockKeyhole size={15} aria-hidden="true" />
                <input type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="••••••••••••" required />
                <button type="button" className="icon-button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
            <label className="login-remember"><input type="checkbox" /><span>Recordar este terminal por 30 días</span></label>
            {error && <div className="form-error">{error}</div>}
            <button className="button primary login-button" disabled={saving}>{saving ? 'Validando...' : <>Iniciar sesión <ArrowRight size={16} /></>}</button>
          </form>

          <div className="login-divider"><span>acceso institucional</span></div>
          <div className="login-secure-note"><ShieldCheck size={14} /> Servidores centrales en línea <small>v4.12.8</small></div>
        </div>
      </section>
    </main>
  )
}
