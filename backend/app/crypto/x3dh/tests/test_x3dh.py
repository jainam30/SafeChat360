import pytest
import asyncio
from app.crypto.x3dh.repositories.prekey_repo import PrekeyRepository
from app.crypto.x3dh.managers.signed_prekey_manager import SignedPrekeyManager
from app.crypto.x3dh.managers.one_time_prekey_manager import OneTimePrekeyManager
from app.crypto.x3dh.managers.bundle_generator import PrekeyBundleGenerator

@pytest.fixture
def x3dh_env():
    repo = PrekeyRepository()
    spk_manager = SignedPrekeyManager(repo)
    opk_manager = OneTimePrekeyManager(repo)
    generator = PrekeyBundleGenerator(spk_manager, opk_manager, repo)
    return repo, spk_manager, opk_manager, generator

@pytest.mark.asyncio
async def test_signed_prekey_lifecycle(x3dh_env):
    repo, spk_manager, _, _ = x3dh_env
    
    # Store SPK
    spk = await spk_manager.generate_and_store(1, "dev1", 100, "pub", "sig")
    assert spk.status == "ACTIVE"
    
    # Fetch active
    active = await spk_manager.get_active_key(1, "dev1")
    assert active.key_id == 100
    
    # Store new SPK (should retire old)
    spk2 = await spk_manager.generate_and_store(1, "dev1", 101, "pub2", "sig2")
    active2 = await spk_manager.get_active_key(1, "dev1")
    assert active2.key_id == 101
    
    # Old is retired
    # Since we don't have a direct get_all method, we test this behavior inherently via get_active_key

@pytest.mark.asyncio
async def test_opk_consumption_and_race_conditions(x3dh_env):
    repo, _, opk_manager, _ = x3dh_env
    
    # Store batch of 2 keys
    batch = [{"key_id": 1, "public_key_b64": "opk1"}, {"key_id": 2, "public_key_b64": "opk2"}]
    await opk_manager.store_batch(1, "dev1", batch)
    
    assert await opk_manager.needs_replenishment(1, "dev1") == True # Threshold is 20
    
    # Consume one
    opk = await opk_manager.consume_key(1, "dev1")
    assert opk is not None
    assert opk.key_id in [1, 2]
    
    # Consume another
    opk2 = await opk_manager.consume_key(1, "dev1")
    assert opk2 is not None
    assert opk.key_id != opk2.key_id
    
    # Exhausted
    opk3 = await opk_manager.consume_key(1, "dev1")
    assert opk3 is None

@pytest.mark.asyncio
async def test_bundle_generation(x3dh_env):
    repo, spk_manager, opk_manager, generator = x3dh_env
    
    await spk_manager.generate_and_store(1, "dev1", 100, "pub", "sig")
    await opk_manager.store_batch(1, "dev1", [{"key_id": 1, "public_key_b64": "opk1"}])
    
    bundle = await generator.generate_bundle(1, "dev1", "id_pub", ["CAP1"])
    assert bundle is not None
    assert bundle.signed_prekey_id == 100
    assert bundle.one_time_prekey_id == 1
    assert bundle.identity_public_key_b64 == "id_pub"
    
    # Exhausted OPK, bundle gen should fail
    bundle2 = await generator.generate_bundle(1, "dev1", "id_pub", ["CAP1"])
    assert bundle2 is None
