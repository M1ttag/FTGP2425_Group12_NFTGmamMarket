export function fromWei(wei, unit = 'ether') {
  const decimals = unit === 'ether' ? 18 : 0;
  const weiBigInt = BigInt(wei);
  const unitValue = BigInt(10 ** decimals);
  const integerPart = weiBigInt / unitValue;
  const fractionalPart = weiBigInt % unitValue;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fractionalStr ? `${integerPart}.${fractionalStr}` : integerPart.toString();
}

export function toWei(ether, unit = 'ether') {
  const decimals = unit === 'ether' ? 18 : 0 ;
  const [integer, fraction = ''] = ether.split('.');
  const paddedFraction = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  const weiStr = integer + paddedFraction;
  return BigInt(weiStr);
}