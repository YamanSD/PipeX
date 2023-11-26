/**
 * Common component for the login and sign-up forms.
 */
import styled from 'styled-components';
import {useState} from "react";
import {FiEye, FiEyeOff} from 'react-icons/fi'

/**
 * Main color used for styling the component.
 */
export const mainColor = "#3498ff";

/**
 * Darker main color.
 */
export const mainColor_1 = "#2387ee";

/**
 * Secondary color used in the application.
 */
export const secondaryColor = "rgb(66, 69, 73)";

/**
 * Darker secondary
 */
export const secondaryColor_1 = "rgb(30, 33, 36)";

/**
 * Lighter secondary
 */
export const secondaryColor_2 = "rgb(74, 76, 81)";

/**
 * Lighter secondary
 */
export const secondaryColor_4 = "rgb(84, 86, 91)";

/**
 * Box container.
 */
export const BoxContainer = styled.div`
  height: 300px;
  width: 100%;
  margin-bottom: 10px;
  justify-content: flex-end;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

/**
 * Form container.
 */
export const FormContainer = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

/**
 * Bold link.
 */
export const BoldLink = styled.a`
  font-size: 12px;
  color: ${mainColor};
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px dashed ${mainColor};
`;

type DataInput = {
    value: string,
    isErr?: boolean,
    onChange: (e: any) => any,
    placeholder: string,
    errMsg?: string,
    setIsErr?: (v: boolean) => any
};

/**
 * @param value in the field.
 * @param onChange when field is changed.
 * @param setIsErr to set the value to error.
 * @param errMsg string for error message.
 * @param placeholder placeholder
 * @param isErr boolean, true shows error.
 * @constructor
 */
export const Input = ({ value, onChange, errMsg, setIsErr, placeholder, isErr }: DataInput) => {
    return (
        <MainInputContainer>
            <InputContainer>
                <RawPasswordInput value={value}
                                  style={isErr ? {
                                      color: "#ea4335",
                                      border: "1px solid red",
                                  } : undefined}
                                  onChange={(e) => {
                                      if (setIsErr) {
                                          setIsErr(false);
                                      }

                                      onChange(e);
                                  }}
                                  placeholder={placeholder}
                />
                <ErrorMsg style={isErr ? {
                    color: "#ea4335"
                } : undefined}>
                    {errMsg}
                </ErrorMsg>
            </InputContainer>
        </MainInputContainer>
    );
}

/**
 * Used by password field
 */
const ErrorMsg = styled.p`
    height: 10px;
    margin-left: 6px;
    margin-top: 3px;
    color: transparent;
    font-size: 10px;
`;

/**
 * Used by password field
 */
const InputContainer = styled.p`
  flex: 6.5;
  width: 100%;
  height: 55px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 5px;
`

/**
 * Used by password field
 */
const RawPasswordInput = styled.input`
      height: 42px;
      font-weight: 500;
      font-family: Poppins, sans-serif;
      color: white;
      outline: none;
      border: 0;
      border-bottom: 1px solid ${secondaryColor_1};
      border-radius: 5px;
      padding: 0 10px;
      transition: all 200ms ease-in-out;
      background-color: ${secondaryColor_2};
    
      &::placeholder {
        color: rgba(255, 255, 255, 0.8);
      }
      
      &:focus {
        outline: none;
        border-bottom: 1px solid ${mainColor};
      }
`;

/**
 * Used by password field
 */
const MainInputContainer = styled.div`
      width: 100%;
      flex-direction: row;
      display: flex;
      justify-content: space-between;
      align-items: center;
`;

/**
 * Used by password field
 */
const PasswordSpan = styled.span`
    height: 55px;
    margin-bottom: 5px;
    flex: 1;
    display: flex;
    width: 10%;
    align-items: center;
    justify-content: center;
`;

type PassInput = {
    value: string,
    isErr?: boolean,
    onChange: (e: any) => any,
    placeholder: string,
    setIsErr?: (v: boolean) => any
};

/**
 * @param value in the field.
 * @param onChange when field is changed.
 * @param setIsErr to set the value to error.
 * @param placeholder placeholder
 * @param isErr boolean, true shows error.
 * @constructor
 */
export const PasswordInput = ({ value, onChange, setIsErr,
                                  placeholder, isErr }: PassInput) => {
    const [isVisible, setVisible] = useState(false);

    const toggle = () => {
        setVisible(!isVisible);
    };

    return (
        <MainInputContainer>
            <InputContainer>
                <RawPasswordInput value={value}
                               onChange={(e) => {
                                   if (setIsErr) {
                                       setIsErr(false);
                                   }

                                   onChange(e);
                               }}
                               style={isErr ? {
                                   color: "#ea4335",
                                   border: "1px solid red",
                               } : undefined}
                               placeholder={placeholder}
                               type={!isVisible ? "password" : "text"}
                />
                <ErrorMsg style={isErr ? {
                    color: "#ea4335"
                } : undefined}>
                    Invalid password
                </ErrorMsg>
            </InputContainer>
            <PasswordSpan onClick={toggle}>
                {isVisible ?
                    <FiEye
                        size={18}
                        color={"#fff"}
                        style={{
                            marginBottom: "13px",
                        }}
                    /> :
                    <FiEyeOff
                        size={18}
                        color={"#fff"}
                        style={{
                            marginBottom: "13px",
                        }}
                    />
                }
            </PasswordSpan>
        </MainInputContainer>
    );
}

/**
 * Submit button.
 */
export const SubmitButton = styled.button`
  width: 100%;
  max-width: 150px;
  padding: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: all 240ms ease-in-out;
  background: linear-gradient(
    58deg, ${mainColor_1} 20%, ${mainColor} 100%
  );

  &:hover {
    filter: brightness(1.03);
  }
`;

/**
 * Text.
 */
export const LineText = styled.p`
  font-size: 12px;
  color: rgba(200, 200, 200, 0.8);
  font-weight: 500;
`;