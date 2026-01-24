import React from 'react';
import styled from 'styled-components';

const ChatBotCard = ({
  content,
  onChange,
  onFileSelect,
  onSubmit,
  loading,
  mediaPreview,
  privacy,
  onPrivacyToggle,
  onClearMedia
}) => {
  const fileInputRef = React.useRef(null);

  const getPrivacyIcon = () => {
    // Just a visual indicator - Globe = Public, Lock = Private, Users = Friends
    // Using existing SVG paths or generic ones. Let's stick to the existing SVGs for style consistency but maybe tweak color/tooltip
    return null;
  };

  return (
    <StyledWrapper>
      <div className="container_chat_bot">
        <div className="container-chat-options">
          <div className="chat">
            <div className="chat-bot">
              <textarea
                id="chat_bot"
                name="chat_bot"
                placeholder={`What's on your mind? (${privacy})`}
                value={content}
                onChange={onChange}
              />
              {mediaPreview && (
                <div className="media-preview" style={{ padding: '0 10px 10px 10px', position: 'relative' }}>
                  <img src={mediaPreview} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px' }} />
                  <button onClick={onClearMedia} style={{ position: 'absolute', top: 5, right: 15, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                </div>
              )}
            </div>
            <div className="options">
              <div className="btns-add">
                {/* Button 1: Add Media */}
                <button onClick={() => fileInputRef.current?.click()} title="Add Photo/Video">
                  <svg xmlns="http://www.w3.org/2000/svg" width={28} height={28} viewBox="0 0 24 24">
                    {/* Plus Icon Style */}
                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                  </svg>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={onFileSelect} style={{ display: 'none' }} />

                {/* Button 2: Privacy Toggle */}
                <button onClick={onPrivacyToggle} title={`Current: ${privacy}`}>
                  {privacy === 'public' ? (
                    <svg viewBox="0 0 24 24" height={28} width={28} xmlns="http://www.w3.org/2000/svg"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.01 8.01 0 0 0 5.648 6.667M10.03 13c.151 2.439.848 4.73 1.97 6.752A15.9 15.9 0 0 0 13.97 13zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.01 8.01 0 0 0 19.938 13M4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333A8.01 8.01 0 0 0 4.062 11m5.969 0h3.938A15.9 15.9 0 0 0 12 4.248A15.9 15.9 0 0 0 10.03 11m4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.01 8.01 0 0 0-5.648-6.667" fill="currentColor" /></svg>
                  ) : privacy === 'friends' ? (
                    <svg viewBox="0 0 24 24" height={28} width={28} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" height={28} width={28} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  )}
                </button>

                {/* Button 3: Unused for now */}
                <button>
                  <svg viewBox="0 0 24 24" height={28} width={28} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>
              </div>
              <button className="btn-submit" onClick={onSubmit} disabled={loading}>
                {loading ? (
                  <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                ) : (
                  <i>
                    <svg viewBox="0 0 512 512" width={28} height={28}>
                      <path fill="currentColor" d="M473 39.05a24 24 0 0 0-25.5-5.46L47.47 185h-.08a24 24 0 0 0 1 45.16l.41.13l137.3 58.63a16 16 0 0 0 15.54-3.59L422 80a7.07 7.07 0 0 1 10 10L226.66 310.26a16 16 0 0 0-3.59 15.54l58.65 137.38c.06.2.12.38.19.57c3.2 9.27 11.3 15.81 21.09 16.25h1a24.63 24.63 0 0 0 23-15.46L478.39 64.62A24 24 0 0 0 473 39.05" />
                    </svg>
                  </i>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="tags">
          <span onClick={() => onPrivacyToggle()}>Privacy: {privacy}</span>
          <span>Add Media</span>
          <span>More</span>
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width: 100%;
  .container_chat_bot {
    display: flex;
    flex-direction: column;
    max-width: 100%;
    width: 100%;
  }

  .container_chat_bot .container-chat-options {
    position: relative;
    display: flex;
    background: linear-gradient(
      to bottom right,
      #7e7e7e,
      #363636,
      #363636,
      #363636,
      #363636
    );
    border-radius: 16px;
    padding: 2px;
    overflow: hidden;

    &::after {
      position: absolute;
      content: "";
      top: -10px;
      left: -10px;
      background: radial-gradient(
        ellipse at center,
        #ffffff,
        rgba(255, 255, 255, 0.3),
        rgba(255, 255, 255, 0.1),
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0)
      );
      width: 30px;
      height: 30px;
      filter: blur(1px);
    }
  }

  .container_chat_bot .container-chat-options .chat {
    display: flex;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 15px;
    width: 100%;
    overflow: hidden;
  }

  .container_chat_bot .container-chat-options .chat .chat-bot {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .container_chat_bot .chat .chat-bot textarea {
    background-color: transparent;
    border-radius: 16px;
    border: none;
    width: 100%;
    height: 200px;
    min-height: 150px;
    color: #ffffff;
    font-family: sans-serif;
    font-size: 14px;
    font-weight: 400;
    padding: 16px;
    resize: none;
    outline: none;

    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 5px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #555;
      cursor: pointer;
    }

    &::placeholder {
      color: #f3f6fd;
      transition: all 0.3s ease;
      font-size: 14px;
    }
    &:focus::placeholder {
      color: #363636;
    }
  }

  .container_chat_bot .chat .options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
  }

  .container_chat_bot .chat .options .btns-add {
    display: flex;
    gap: 16px;

    & button {
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.3);
      background-color: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 8px;
      border-radius: 50%;

      &:hover {
        transform: translateY(-2px);
        color: #ffffff;
        background-color: rgba(255,255,255,0.05);
      }
    }
  }

  .container_chat_bot .chat .options .btn-submit {
    display: flex;
    padding: 4px;
    background-image: linear-gradient(to top, #292929, #555555, #292929);
    border-radius: 12px;
    box-shadow: inset 0 6px 2px -4px rgba(255, 255, 255, 0.5);
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.15s ease;
    width: 44px;
    height: 44px;

    & i {
      width: 100%;
      height: 100%;
      padding: 8px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      backdrop-filter: blur(3px);
      color: #8b8b8b;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    & svg {
      transition: all 0.3s ease;
    }
    &:hover svg {
      color: #f3f6fd;
      filter: drop-shadow(0 0 5px #ffffff);
    }

    &:focus svg {
      color: #f3f6fd;
      filter: drop-shadow(0 0 5px #ffffff);
      transform: scale(1.1) rotate(45deg);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  /* Responsive Mobile Tweaks */
  @media (max-width: 640px) {
    .container_chat_bot .chat .chat-bot textarea {
        height: 150px;
    }
    .container_chat_bot .tags {
        gap: 4px;
        flex-wrap: wrap;
    }
    .container_chat_bot .chat .options .btns-add {
        gap: 8px;
    }
  }

  .container_chat_bot .tags {
    padding: 14px 0;
    display: flex;
    color: #ffffff;
    font-size: 11px;
    gap: 8px;
    flex-wrap: wrap;

    & span {
      padding: 6px 12px;
      background-color: #1b1b1b;
      border: 1.5px solid #363636;
      border-radius: 12px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s;

      &:hover {
          border-color: #555;
          background-color: #252525;
      }
    }
  }`;

export default ChatBotCard;
