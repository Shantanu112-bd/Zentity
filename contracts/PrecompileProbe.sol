// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PrecompileProbe {
    struct ProbeResult {
        bool success;
        bytes output;
        uint256 gasUsed;
    }

    function probe(address target, bytes calldata data) external view returns (ProbeResult memory result) {
        uint256 gasBefore = gasleft();
        (bool success, bytes memory returnData) = target.staticcall(data);
        uint256 gasUsed = gasBefore - gasleft();

        return ProbeResult({
            success: success,
            output: returnData,
            gasUsed: gasUsed
        });
    }

    function probeAdd(bytes calldata data) external view returns (ProbeResult memory) {
        return this.probe(address(0x06), data);
    }

    function probeMul(bytes calldata data) external view returns (ProbeResult memory) {
        return this.probe(address(0x07), data);
    }

    function probePairing(bytes calldata data) external view returns (ProbeResult memory) {
        return this.probe(address(0x08), data);
    }
}

