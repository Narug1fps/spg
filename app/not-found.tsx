"use client";
import styled from "styled-components";

export default function notFound() {
  return (
    <>
      <StyledComponent className=" selection:bg-primary bg-white">
        <h1>404</h1>
        <h2>Ops! Parece que você está perdido!</h2>
        <h3>Esta página não esta disponível...</h3>
        <a href="/">Voltar ao Inicio</a>
      </StyledComponent>
    </>
  );
}

const StyledComponent = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 100vh;
  background-image: url("https://pinstergames.vercel.app/_next/image?url=%2Fimages%2F404.gif&w=3840&q=75");
  background-repeat: no-repeat;
  background-position: center 50%;

  * {
    text-align: center;
  }

  h1 {
    color: var(--color-gray);
    font-size: 7rem;
    margin-bottom: 320px;
    font-family: "Courier New", Courier, monospace;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;

    &::after {
      content: "Erro: Página Não Encontrada";
      bottom: 0%;
      position: absolute;
      text-align: center;
      display: block;
      color: var(--color-text-soft);
      font-size: 1.5rem;
      width: 80dvw;
      @media (max-width: 720px) {
        bottom: -30%;
      }
    }
  }

  h2 {
    color: var(--color-text);
    font-size: min(3rem, 5vw);
    margin-bottom: 10px;
  }

  h3 {
    color: var(--color-text-soft);
    font-size: min(2rem, 4vw);
    margin-bottom: 20px;
  }

  a {
    display: block;
    background: var(--color-primary-soft);
    padding: 10px 20px;
    color: #000;
    font-weight: bold;
    border-radius: 10px 0px;

    &:hover {
      border-radius: 0px 10px;
    }
  }
`;
