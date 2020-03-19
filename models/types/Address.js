const validateAddr = (address) => address.match(/^0x[0-9a-f]{40}$/);
const normalizeAddr = (address) => address && (address.match(/^0x0+$/) ? null : address.toLowerCase());

module.exports = {
    default: {
        type: String,
        validate: { validator: validateAddr, message: 'Invalid address.' },
        set: normalizeAddr
    },
    validateAddr,
    normalizeAddr
}