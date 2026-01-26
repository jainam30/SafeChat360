import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import logoImg from '../assets/safechat_logo.png';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Custom color for Forgot Password (Orange)
    const borderColor = '#ffa500';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSubmitted(true);
            toast.success('Password reset email sent!');
        } catch (error) {
            console.error("Reset Password Error:", error);
            toast.error(error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <div className="flex-column" style={{ alignItems: 'center', marginBottom: '30px', zIndex: 2 }}>
                <Link to="/">
                    <img src={logoImg} alt="SafeChat360" style={{ height: '100px', width: '100px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} />
                </Link>
            </div>
            <StyledWrapper $borderColor={borderColor}>
                <div className="card-wrapper">
                    <div className="form"> {/* Usage of logic inside the same styled container */}

                        {!submitted ? (
                            <>
                                <h2 style={{ textAlign: 'center', color: '#151717', fontWeight: '700', marginBottom: '20px' }}>Reset Password</h2>

                                <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div className="flex-column">
                                        <label>Email Address</label>
                                    </div>
                                    <div className="inputForm">
                                        <svg height={20} viewBox="0 0 32 32" width={20} xmlns="http://www.w3.org/2000/svg">
                                            <g id="Layer_3" data-name="Layer 3">
                                                <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" />
                                            </g>
                                        </svg>
                                        <input
                                            type="email"
                                            className="input"
                                            placeholder="Enter your Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button className="button-submit" type="submit" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                <div style={{ color: '#28a745' }}>
                                    <CheckCircle size={50} />
                                </div>
                                <h3 style={{ color: '#151717', fontSize: '20px', fontWeight: '600' }}>Check your email</h3>
                                <p style={{ color: '#666', fontSize: '14px' }}>
                                    We've sent password reset instructions to <br /><strong>{email}</strong>
                                </p>
                                <button className="button-submit" onClick={() => setSubmitted(false)} style={{ backgroundColor: 'transparent', border: '1.5px solid #ecedec', color: '#151717' }}>
                                    Resend Email
                                </button>
                            </div>
                        )}

                        <div className="flex-row" style={{ justifyContent: 'center', marginTop: '20px' }}>
                            <span className="span" onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <ArrowLeft size={14} /> Back to Login
                            </span>
                        </div>

                    </div>
                </div>
            </StyledWrapper>
        </PageContainer>
    );
}

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #1a1a2e;
`;

const StyledWrapper = styled.div`
  .card-wrapper {
    position: relative;
    border-radius: 24px;
    padding: 3px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 20px;
  }

  .card-wrapper::before {
    content: '';
    position: absolute;
    width: 250%; 
    height: 250%;
    left: -75%;
    top: -75%;
    background: conic-gradient(
      transparent 0deg, 
      transparent 320deg, 
      ${props => props.$borderColor} 330deg, 
      ${props => props.$borderColor} 360deg
    );
    animation: ${rotate} 4s linear infinite;
    z-index: 0;
  }

  .card-wrapper::after {
    content: '';
    position: absolute;
    inset: 3px;
    background: #ffffff;
    border-radius: 20px;
    z-index: 0;
  }

  .form {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: #ffffff;
    padding: 30px;
    width: 100%;
    max-width: 450px;
    border-radius: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  @media (max-width: 480px) {
    .form {
      padding: 20px;
    }
  }

  .flex-column > label {
    color: #151717;
    font-weight: 600;
  }

  .inputForm {
    border: 1.5px solid #ecedec;
    border-radius: 10px;
    height: 50px;
    display: flex;
    align-items: center;
    padding-left: 10px;
    transition: 0.2s ease-in-out;
  }

  .input {
    margin-left: 10px;
    border-radius: 10px;
    border: none;
    width: 85%;
    height: 100%;
    outline: none;
    background-color: transparent;
    color: #151717;
    font-size: 15px;
  }

  .inputForm:focus-within {
    border: 1.5px solid ${props => props.$borderColor};
  }

  .button-submit {
    margin: 10px 0;
    background-color: #151717;
    border: none;
    color: white;
    font-size: 15px;
    font-weight: 500;
    border-radius: 10px;
    height: 50px;
    width: 100%;
    cursor: pointer;
    transition: 0.2s ease-in-out;
  }

  .button-submit:hover {
    background-color: #252727;
  }

  .span {
    font-size: 14px;
    color: ${props => props.$borderColor};
    font-weight: 500;
    cursor: pointer;
  }
`;

export default ForgotPassword;
