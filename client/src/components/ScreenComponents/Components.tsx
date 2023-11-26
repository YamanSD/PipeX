import styled from "styled-components";
import {mainColor, mainColor_1, secondaryColor_1, secondaryColor_4} from "../AuthBox/common";
import {useState} from "react";
import {FiEye, FiEyeOff} from "react-icons/fi";

export const MainContainer = styled.div`
  height: 100%;
  width: 97vw;
  justify-content: center;
  flex-direction: column;
  display: flex;
  padding: 20px 20px 0 20px;
  border-radius: 15px;
  margin: 25px 10px 10px 10px;
  background-color: rgb(74, 76, 81);
  box-shadow: 0 3px 3px rgba(52, 152, 255, 0.5);
  border: 2px solid #3498ff;
`;

export const ButtonContainer = styled.div`
  margin-top: 10px;
  width: 100%;
  justify-content: center;
  align-items: center;
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

/**
 * Text.
 */
export const LineText = styled.p`
  font-size: 12px;
  color: rgba(200, 200, 200, 0.8);
  font-weight: 500;
`;

/**
 * Input field.
 */
export const RawPasswordInput = styled.input`
  margin-top: 5px;
  margin-left: 5px;
  width: 100%;
  font-weight: 500;
  font-family: Poppins, sans-serif;
  height: 42px;
  color: white;
  outline: none;
  border: 0;
  border-bottom: 1px solid ${secondaryColor_1};
  border-radius: 5px;
  padding: 0 10px;
  transition: all 200ms ease-in-out;
  margin-bottom: 5px;
  background-color: ${secondaryColor_4};

  &::placeholder {
    color: rgba(255, 255, 255, 0.8);
  }
  
  &:focus {
    outline: none;
    border-bottom: 1px solid ${mainColor};
  }
`;


export const SubmitButton = styled.button`
  width: 100%;
  max-width: 300px;
  padding: 10px;
  height: 60px;
  color: #fff;
  font-size: 15px;
  border: solid white 1px;
  border-radius: 15px;
  cursor: pointer;
  margin-bottom: 3px;
  margin-top: 7px;
  transition: all 240ms ease-in-out;
  background: linear-gradient(
    58deg, ${mainColor_1} 20%, ${mainColor} 100%
  );

  &:hover {
    filter: brightness(1.03);
  }
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
  flex: 10;
  width: 100%;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 5px;
`

/**
 * Used by password field
 */
const MainInputContainer = styled.div`
      width: 100%;
      flex-direction: row;
      display: flex;
      justify-content: space-around;
      align-items: center;
`;

/**
 * Used by password field
 */
const PasswordSpan = styled.span`
    background-color: #3c4043;
    height: 40px;
    border-radius: 5px;
    border: 2px solid white;
    margin-bottom: 18px;
    box-shadow: 0 2px 5px rgba(255, 255, 255, 0.3);
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`;

type PassInput = {
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
 * @param placeholder placeholder
 * @param isErr boolean, true shows error.
 * @param errMsg error message.
 * @constructor
 */
export const PasswordInput = ({ errMsg, value, onChange, setIsErr,
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
                    {errMsg ?? "Password required"}
                </ErrorMsg>
            </InputContainer>
            <span style={{flex: 0.6}} />
            <PasswordSpan onClick={toggle}>
                {isVisible ?
                    <FiEye
                        size={18}
                        color={"#fff"}
                    /> :
                    <FiEyeOff
                        size={18}
                        color={"#fff"}
                    />
                }
            </PasswordSpan>
        </MainInputContainer>
    );
}
