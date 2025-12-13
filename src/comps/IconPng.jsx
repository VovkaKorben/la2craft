export const IconPng = ({ icon, ...props }) => {
    const src = `./icon/${icon}.png`;

    return (
        <img
            src={src}
            alt={icon}
            className="iconpng"
             style={{  borderRadius: "3px" }}
            {...props}
        />
    );
};