import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { homeOf, useAuth } from '../auth/AuthContext';
import { loadScript } from '../utils/loadScript';

// Client ID loại "Web application" ở Google Cloud Console, đặt trong frontend/.env: VITE_GOOGLE_CLIENT_ID=...
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
// App ID của ứng dụng Facebook (developers.facebook.com), đặt trong frontend/.env: VITE_FACEBOOK_APP_ID=...
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';
const FACEBOOK_SDK = 'https://connect.facebook.net/vi_VN/sdk.js';
const FACEBOOK_VERSION = 'v26.0';

// Đăng nhập bằng mạng xã hội (PB-17 Google, PB-18 Facebook): 200 -> vào trang theo vai trò; 202 -> MH-13 Chọn vai trò
export function SocialLogin({ onError, from }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const send = async (url, body) => {
    onError('');
    setBusy(true);
    try {
      const res = await client.post(url, body);
      if (res.status === 202) {
        navigate('/social/complete', { state: { signup: res.data, from } });
      } else {
        const user = signIn(res.data);
        navigate(from || homeOf(user.role), { replace: true });
      }
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="social">
      <div className="or-line"><span>hoặc</span></div>
      <GoogleButton busy={busy} onToken={(idToken) => send('/api/auth/google', { idToken })} />
      <FacebookButton busy={busy} onError={onError} onToken={(accessToken) => send('/api/auth/facebook', { accessToken })} />
    </div>
  );
}

// Nút "Tiếp tục với Google": nút của trang, phủ lên trên là nút trong suốt của Google Identity Services
// (Google chỉ cấp ID token qua nút của họ) nên giao diện vẫn đồng bộ.
function GoogleButton({ busy, onToken }) {
  const box = useRef(null);
  const handler = useRef(onToken);
  const [ready, setReady] = useState(false);
  handler.current = onToken;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let alive = true;
    loadScript('https://accounts.google.com/gsi/client')
      .then(() => {
        const gid = window.google?.accounts?.id;
        if (!alive || !gid || !box.current) return;
        gid.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => handler.current(r.credential) });
        gid.renderButton(box.current, {
          type: 'standard', theme: 'outline', size: 'large', text: 'continue_with',
          width: Math.min(400, box.current.offsetWidth || 320),
        });
        setReady(true);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div className="social-btn">
      <button
        type="button"
        className="btn ghost full"
        tabIndex={-1}
        disabled={!GOOGLE_CLIENT_ID || busy}
        title={GOOGLE_CLIENT_ID ? '' : 'Chưa cấu hình VITE_GOOGLE_CLIENT_ID'}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        <span>{busy ? 'Đang xử lý...' : 'Tiếp tục với Google'}</span>
      </button>
      {GOOGLE_CLIENT_ID && <div className={`social-overlay ${ready ? 'ready' : ''}`} ref={box} />}
    </div>
  );
}
// Nút "Tiếp tục với Facebook": tải Facebook SDK sẵn khi mở trang (FB.login phải gọi ngay trong lúc bấm,
// nếu chờ tải SDK thì trình duyệt chặn cửa sổ đăng nhập), lấy access token rồi gửi cho backend kiểm tra.
function FacebookButton({ busy, onToken, onError }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!FACEBOOK_APP_ID) return undefined;
    let alive = true;
    loadScript(FACEBOOK_SDK)
      .then(() => {
        if (!alive || !window.FB) return;
        window.FB.init({ appId: FACEBOOK_APP_ID, cookie: false, xfbml: false, version: FACEBOOK_VERSION });
        setReady(true);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const login = () => {
    if (!window.FB) return;
    window.FB.login((res) => {
      if (res.authResponse?.accessToken) onToken(res.authResponse.accessToken);
      else onError('Bạn đã hủy đăng nhập Facebook');
    }, { scope: 'public_profile,email' });
  };

  return (
    <div className="social-btn">
      <button
        type="button"
        className="btn ghost full"
        disabled={!FACEBOOK_APP_ID || !ready || busy}
        title={FACEBOOK_APP_ID ? '' : 'Chưa cấu hình VITE_FACEBOOK_APP_ID'}
        onClick={login}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z" />
          <path fill="#FFFFFF" d="M16.67 15.56l.53-3.5h-3.32V9.8c0-.96.46-1.89 1.96-1.89h1.5V4.94s-1.37-.24-2.68-.24c-2.74 0-4.54 1.68-4.54 4.7v2.66H7.08v3.5h3.04V24c.61.1 1.24.14 1.88.14s1.27-.05 1.88-.14v-8.44h2.79z" />
        </svg>
        <span>{busy ? 'Đang xử lý...' : 'Tiếp tục với Facebook'}</span>
      </button>
    </div>
  );
}
