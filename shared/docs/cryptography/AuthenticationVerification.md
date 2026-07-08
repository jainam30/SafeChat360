# Authentication Verification

SafeChat360 treats all incoming packets as mathematically radioactive until they are authenticated.

## The AAD Reassembly
When a packet arrives over the wire, it is deserialized into the `EncryptedMessage` object. The `HeaderValidator` immediately intercepts the `MessageHeader` property. If the header claims to be from the future, or has negative message counters, the packet is instantly dropped.

Only if structural validation passes does the `AssociatedDataBuilder` serialize the header back into JSON bytes. Because AES-GCM mathematically binds these bytes to the payload, if a man-in-the-middle changed *anything* (even reordering a JSON key), the AAD byte array will not match what the sender used, and the MAC verification will fail.
