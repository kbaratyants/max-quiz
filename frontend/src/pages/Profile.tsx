import { isMaxWebApp, getUserInfoFromWebApp } from '../utils/webapp';

export default function Profile() {
  const userInfo = getUserInfoFromWebApp();
  const isInMax = isMaxWebApp();

  return (
    <div className="container">
      <h2>Профиль</h2>
      
      {isInMax && userInfo ? (
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            {userInfo.photoUrl && (
              <img 
                src={userInfo.photoUrl} 
                alt="Avatar" 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%',
                  objectFit: 'cover'
                }} 
              />
            )}
            <div>
              <h3>
                {userInfo.firstName} {userInfo.lastName}
              </h3>
              {userInfo.username && (
                <p style={{ color: '#666', marginTop: '5px' }}>@{userInfo.username}</p>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>ID:</strong> {userInfo.id}
            </div>
            {userInfo.languageCode && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Язык:</strong> {userInfo.languageCode}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: '20px', textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666' }}>
            Профиль доступен только в MAX WebApp
          </p>
        </div>
      )}
    </div>
  );
}

