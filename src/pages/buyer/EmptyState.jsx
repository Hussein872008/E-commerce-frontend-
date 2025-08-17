import PropTypes from 'prop-types';

const EmptyState = ({ icon, title, description, action }) => {
    return (
        <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4 text-gray-400">
                {icon}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
            {action}
        </div>
    );
};

EmptyState.propTypes = {
    icon: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    action: PropTypes.node,
};

export default EmptyState;