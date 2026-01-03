export const IconPng = ({ icon, count, ...props }) => {
    const src = `./icon/${icon}.png`;



    const content = <img
        src={src}
        alt={icon}
        className="iconpng"
        style={{ borderRadius: "3px" }}
        {...props}
    />;

    // 2. Оборачиваем по условию
    if (count) {
        return <div className="iconcount">{content}
            <span>{count}</span>
        </div>;
    }

    return content;




};