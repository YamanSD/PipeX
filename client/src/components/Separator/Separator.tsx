import styled from "styled-components";

/**
 * Type alias for the prop-type of the component.
 */
type Properties = {
    vertical?: boolean,
    margin: string
};

/**
 * Invisible separator component.
 * Mainly used by the AuthBox.
 *
 * @param vertical iff not undefined, the separator is vertical.
 * @param margin margin attribute string.
 * @constructor
 */
const Separator = ({ vertical, margin }: Properties) => {
    /* holds the styled component */
    const Result = styled.span`
        display: flex;
        ${vertical !== undefined ? "height" : "width"}: ${margin}
    `;

    return <Result />;
};

export default Separator;
