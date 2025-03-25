import styled from "styled-components";

export const HomeContainer = styled.div`
  text-align: center;
  padding: 3rem;
`;

export const HeaderBar = styled.header`
  background-color: #242424;
  padding: 1rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const HeaderNav = styled.nav`
  display: flex;
  gap: 2rem;
`;

export const HeaderLink = styled.a`
  color: white;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;

  &:hover {
    text-decoration: underline;
  }
`;
