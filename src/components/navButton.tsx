import { Button, ButtonProps } from 'react-bootstrap'

const NavButton: React.FC<ButtonProps> = ({ children, ...props }) => {
    return (
        <Button
            variant="dark"
            style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'start' }}
            {...props}>
            {children}
        </Button>
    )
}
export default NavButton
