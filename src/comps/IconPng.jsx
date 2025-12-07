export const IconPng = ({ name, size = 32, className, ...props }) => {
    const src = `/icon/${name}.png`;

    return (
        <img
            src={src}
            alt={name}
            className={className}
            style={{ width: size, height: size, objectFit: 'contain' }}
            {...props}
        />
    );
};