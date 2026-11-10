import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const { signIn } = useAuth(); const navigate = useNavigate()
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); try { await signIn({ identificador: identifier, password }); navigate('/', { replace: true }) } catch (err) { setError(err.message) } finally { setSaving(false) } }
  return <main className="login-page"><section className="login-card"><div className="brand-mark"><LockKeyhole size={22} /></div><p className="eyebrow">ObraStock</p><h1>Iniciar sesión</h1><p className="page-description">Accede al control de inventario de tu empresa.</p><form onSubmit={submit}><label className="form-field"><span>Correo o identificación</span><input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required /></label><label className="form-field"><span>Contraseña</span><div className="password-field"><input type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><button type="button" className="icon-button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <div className="form-error">{error}</div>}<button className="button primary login-button" disabled={saving}>{saving ? 'Validando...' : 'Iniciar sesión'}</button></form></section></main>
}
