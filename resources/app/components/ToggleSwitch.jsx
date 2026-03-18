import React from 'react';

const ToggleSwitch = ({ checked, onChange, disabled = false }) => {
    const handleChange = (e) => {
        if (disabled) return;
        onChange(e.target.checked);
    };

    return (
        <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '40px',
            height: '20px',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
        }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                style={{ display: 'none' }}
                disabled={disabled}
            />
            <span style={{
                position: 'absolute',
                cursor: disabled ? 'not-allowed' : 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: checked ? '#000' : '#ccc',
                transition: '.4s',
                borderRadius: '20px',
            }}/>
            <span style={{
                position: 'absolute',
                content: '""',
                height: '16px',
                width: '16px',
                left: checked ? '22px' : '2px',
                bottom: '2px',
                backgroundColor: 'white',
                transition: '.4s',
                borderRadius: '50%',
            }}/>
        </label>
    );
};

export default ToggleSwitch;
