import React from 'react';
import styles from './Styles.module.css';

/**
 * Type alias for the prop-type of the component.
 */
type Properties = {
    children?: React.ReactNode
};

/**
 * Surface component used in components to provide elevation.
 *
 * @param children React components to display inside the surface.
 * @constructor
 */
const Surface = ({children}: Properties) => {
    return (
        <div className={styles.surface}>
            {children}
        </div>
    );
};

export default Surface;
