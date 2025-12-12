import React from 'react';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Switch = ({ checked, onChange }) => {
  return (
    <StyledWrapper>
      <label className="switch">
        <input
          className="toggle"
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <span className="slider">
          <span className="icon icon-open">
            <ChevronLeft size={14} />
          </span>
          <span className="icon icon-close">
            <ChevronRight size={14} />
          </span>
        </span>
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .switch {
    display: inline-block;
    width: 50px;
    height: 26px;
    position: relative;
  }

  .toggle {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: .4s;
    border-radius: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 5px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 2px;
    background-color: #fff;
    transition: .4s;
    border-radius: 50%;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  /* Icons inside the track */
  .icon {
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.3s;
    z-index: 1;
  }
  
  .icon-open {
    opacity: 1;
  }
  
  .icon-close {
    opacity: 0;
  }

  /* Valid checked state (Collapsed) */
  .toggle:checked + .slider {
    background-color: rgba(99, 102, 241, 0.2); /* Cyber Primary transparent (Indigo) */
    border-color: #6366F1;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.3), inset 0 2px 4px rgba(0,0,0,0.5);
  }

  .toggle:checked + .slider:before {
    transform: translateX(24px);
    background-color: #6366F1; /* Cyber Primary (Indigo) */
    box-shadow: 0 0 10px #6366F1;
  }

  .toggle:checked + .slider .icon-open {
    opacity: 0;
  }
  
  .toggle:checked + .slider .icon-close {
    opacity: 1;
  }

  /* Hover effects */
  .slider:hover:before {
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  }
  
  .toggle:checked + .slider:hover:before {
    box-shadow: 0 0 15px #6366F1;
  }
`;

export default Switch;
