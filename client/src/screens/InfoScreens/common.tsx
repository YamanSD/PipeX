import styled from "styled-components";
import {mainColor, mainColor_1} from "../../components/AuthBox/common";

export const BodyContainer = styled.div`
  height: 100%;
  margin: 20px;
  background-color: transparent;
`;

export const MainContainer = styled.div`
  height: 100%;
  max-width: 90%;
  justify-content: center;
  flex-direction: column;
  display: flex;
  padding: 10px 10px 0 10px;
  border-radius: 15px;
  margin: 20px auto;
  background-color: rgb(74, 76, 81);
  box-shadow: 0 6px 6px rgba(52, 152, 255, 0.5);
  border: 1px solid #3498ff;
`;

export const ButtonContainer = styled.div`
  margin-top: 30px;
  height: 130px;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  display: flex;
`;

export const NormalText = styled.p`
  color: white;
  font-size: 16px;
`;

export const HighlightedText = styled.em`
    color: #3498ff
`;

export const SubmitButton = styled.button`
  width: 100%;
  max-width: 300px;
  padding: 10px;
  height: 60px;
  color: #fff;
  font-size: 15px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 240ms ease-in-out;
  background: linear-gradient(
    58deg, ${mainColor_1} 20%, ${mainColor} 100%
  );

  &:hover {
    filter: brightness(1.03);
  }
`;

export const Title = styled.p`
  text-align: center;
  font-size: 60px; 
  font-weight: bold;
  text-decoration: dotted underline 7px;
  color: #3498ff;
`;
