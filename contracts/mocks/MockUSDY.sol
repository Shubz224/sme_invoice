// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDY
 * @notice Mock USDY token for testing (simulates Ondo Finance USDY)
 * @dev Anyone can mint for testing purposes
 */
contract MockUSDY is ERC20, Ownable {
    constructor() ERC20("Mock USDY", "USDY") Ownable(msg.sender) {
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 1_000_000 * 10 ** 6); // 1 million USDY (6 decimals)
    }

    /**
     * @notice Mint tokens to any address (for testing only!)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function - anyone can get 10,000 USDY for testing
     */
    function faucet() external {
        _mint(msg.sender, 10_000 * 10 ** 6); // 10,000 USDY (6 decimals)
    }

    /**
     * @notice Decimals (USDY uses 6 decimals, like real Ondo USDY)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
