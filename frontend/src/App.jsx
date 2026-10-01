import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RutaPrivada } from './auth/RutaPrivada';
import { BarraNavegacion } from './components/BarraNavegacion';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { Feed } from './pages/Feed';
import { Post } from './pages/Post';
import { Perfil } from './pages/Perfil';
import { Sugerencias } from './pages/Sugerencias';
import { Grafo } from './pages/Grafo';
import { Chat } from './pages/Chat';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BarraNavegacion />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/"
            element={
              <RutaPrivada>
                <Feed />
              </RutaPrivada>
            }
          />
          <Route
            path="/post/:id"
            element={
              <RutaPrivada>
                <Post />
              </RutaPrivada>
            }
          />
          <Route
            path="/perfil/:id"
            element={
              <RutaPrivada>
                <Perfil />
              </RutaPrivada>
            }
          />
          <Route
            path="/sugerencias"
            element={
              <RutaPrivada>
                <Sugerencias />
              </RutaPrivada>
            }
          />
          <Route
            path="/grafo"
            element={
              <RutaPrivada>
                <Grafo />
              </RutaPrivada>
            }
          />
          <Route
            path="/chat"
            element={
              <RutaPrivada>
                <Chat />
              </RutaPrivada>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
